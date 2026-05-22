package com.app.workflow.engine;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Utility methods for evaluation of paths and variable interpolation in the Workflow Engine.
 */
public class WorkflowEngineUtils {

    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{([^}]+)\\}\\}");

    /**
     * Traverses a JsonNode based on a dot-notation path (e.g. "data.customer.name").
     * 
     * @param rootNode The root JSON node.
     * @param path The dot-notation path.
     * @return The matching node or a missing node if not found.
     */
    public static JsonNode getValueByPath(JsonNode rootNode, String path) {
        if (rootNode == null || path == null || path.trim().isEmpty()) {
            return null;
        }
        String[] parts = path.trim().split("\\.");
        JsonNode current = rootNode;
        for (String part : parts) {
            current = current.path(part);
            if (current.isMissingNode() || current.isNull()) {
                return current;
            }
        }
        return current;
    }

    /**
     * Interpolates dynamic variables in a string template (e.g. "Hello {{data.customer.name}}")
     * using the resolved values from the trigger payload.
     * 
     * @param template The text template containing placeholders.
     * @param payloadNode The trigger payload mapped as a JSON tree.
     * @return The interpolated text.
     */
    public static String resolveVariables(String template, JsonNode payloadNode) {
        if (template == null) {
            return "";
        }
        if (payloadNode == null || payloadNode.isMissingNode()) {
            return template;
        }

        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            String path = matcher.group(1).trim();
            JsonNode valNode = getValueByPath(payloadNode, path);
            String replacement = (valNode != null && !valNode.isMissingNode() && !valNode.isNull()) ? valNode.asText() : "";
            // Quote replacement to avoid issues with special characters like $ and \
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
